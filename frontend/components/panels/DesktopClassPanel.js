/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import desktopCss from './DesktopClassPanel.css';
import baseCss from './BaseClassPanel.css';
import macros from '../macros';
import Keys from '../../../common/Keys';
import LocationLinks from './LocationLinks';
import WeekdayBoxes from './WeekdayBoxes';
import BaseClassPanel from './BaseClassPanel';

const css = {};
Object.assign(css, baseCss, desktopCss);

const cx = classNames.bind(css);


// Class Panel that renders the box with the class title, class description, and class sections
// If mobile, uses MobileSectionPanel to show the sections.
// The code for desktop is inside this file.


// DesktopClassPanel page component
class DesktopClassPanel extends BaseClassPanel {
  constructor(props) {
    super(props);
    this.state.optPrereqsForPage = 0;
    this.state.prereqsForPage = 0;
  }

  componentDidUpdate() {
    macros.debounceTooltipRebuild();
  }

  componentDidMount() {
    macros.debounceTooltipRebuild();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.optPrereqsForPage !== nextState.optPrereqsForPage;
  }

  // Method to decide whether to show the waitlist or not
  // This logic is different than it is on mobile (because of formatting differences)
  // See MobileSectionPanel.js
  shouldShowWaitlist() {
    const aClass = this.props.aClass;

    // If the class does not have a waitlist, don't show the waitlist
    if (!aClass.getHasWaitList()) {
      return false;
    }

    // If all the sections have 0 seats on the waitlist and 0 total seats, don't show the waitlist (because there isn't actually a waitlist).
    let foundSectionWithWaitlistSeats = false;

    for (const section of aClass.sections) {
      if (section.waitRemaining > 0 || section.waitCapacity > 0) {
        foundSectionWithWaitlistSeats = true;
        break;
      }
    }

    if (!foundSectionWithWaitlistSeats) {
      return false;
    }

    // Also show the waitlist if any of the sections have less than 10 seats left.
    // The number 10 is just an arbitrary decision and can be changed in the future.
    // const foundSectionWithLessThanTenSeats = false;

    for (const section of aClass.sections) {
      if (section.seatsRemaining < 10) {
        return true;
      }
    }

    // If there are plenty of seats left, don't show the waitlist
    return false;
  }

  // Create the 4:35 - 5:40 pm string.
  // This was copied from mobile section panel.js
  // TODO: deduplicate
  getTimeStingFromMeetings(meetingMoments) {
    const times = [];
    meetingMoments.forEach((time) => {
      const startString = time.start.format('h:mm');
      const endString = time.end.format('h:mm a');
      const combinedString = `${startString} - ${endString}`;
      if (!times.includes(combinedString)) {
        times.push(combinedString);
      }
    });
    return times.join(', ');
  }

  render() {
    const aClass = this.props.aClass;
    // Render the section table if this class has sections
    let sectionTable = null;
    if (aClass.sections && aClass.sections.length > 0) {
      // Add the Exam column headers if there are any sections in this class that has exam listed
      let examColumnHeaders = null;
      if (aClass.sectionsHaveExam()) {
        examColumnHeaders = [
          <th key='1'>Exam time</th>,
          <th key='3'>Exam date</th>,
          <th key='4'>Exam location</th>,
        ];
      }

      // Add the Online sections head if there are any sections that are online
      // const showOnlineColumn = aClass.getHasOnlineSections();

      const showWaitList = this.shouldShowWaitlist();

      sectionTable = (
        <table className={ `ui celled striped table ${css.resultsTable}` }>
          <thead>
            <tr>
              <th>
                <div className={ css.inlineBlock } data-tip='Course Reference Number'>
                    CRN
                </div>
              </th>
              <th> Professors </th>
              <th> Weekdays </th>
              <th> Time </th>

              <th> Location </th>
              {examColumnHeaders}
              <th> Seats </th>

              <th
                className={ cx({
                  displayNone: !showWaitList,
                }) }
              > Waitlist seats
              </th>
              <th> Link </th>
            </tr>
          </thead>
          <tbody>
            {/* The CSS applied to the table stripes every other row, starting with the second one.
              This tr is hidden so the first visible row is a dark stripe instead of the second one. */}
            <tr style={{ display:'none', paddingTop: 0, paddingBottom: '1px' }} />
            {this.state.renderedSections.map((section) => {
              // Instead of calculating a lot of these individually and putting them together in the return call
              // Append to this array as we go.
              // So the logic can be separated into distinct if statements.
              const tdElements = [];

              // If it is online, just put one super wide cell
              if (section.online) {
                // How many cells to span
                // need to span more cells if final exam columns are being shown.
                let length = 3;
                if (aClass.sectionsHaveExam()) {
                  length = 6;
                }

                const onlineElement =
                (
                  <td key='onlineWideCell' colSpan={ length } className={ css.wideOnlineCell }>
                    <span className={ css.onlineDivLineContainer }>
                      <span className={ `${css.onlineDivLine} ${css.onlineLeftLine}` } />
                      <span className={ css.onlineText }>Online Class</span>
                      <span className={ css.onlineDivLine } />
                    </span>
                  </td>
                );

                tdElements.push(onlineElement);

              // Have individual cells for the different columns
              } else {
                const meetingMoments = section.getAllMeetingMoments();
                const meetingStrings = this.getTimeStingFromMeetings(meetingMoments);

                const examMeeting = section.getExamMeeting();

                let examTimeString = null;
                if (examMeeting) {
                  examTimeString = this.getTimeStingFromMeetings(examMeeting.times[0]);
                }


                tdElements.push(<td key='weekDayBoxes'> <WeekdayBoxes section={ section } /> </td>);
                tdElements.push(<td key='times'>{meetingStrings}</td>);
                tdElements.push(<td key='locationLinks'> <LocationLinks section={ section } /> </td>);

                // If there are exams, fill in those cells too
                // Calculate the exam elements in each row
                if (aClass.sectionsHaveExam()) {
                  const sectionExamMeeting = section.getExamMeeting();
                  if (examMeeting) {
                    tdElements.push(<td key='exam1'>{examTimeString}</td>);
                    tdElements.push(<td key='exam3'>{sectionExamMeeting.endDate.format('MMM Do')}</td>);
                    tdElements.push(<td key='exam4'>{sectionExamMeeting.where}</td>);
                  } else {
                    tdElements.push(<td key='exam5' />);
                    tdElements.push(<td key='exam6' />);
                    tdElements.push(<td key='exam7' />);
                  }
                }
              }


              return (
                <tr key={ Keys.create(section).getHash() }>
                  <td> {section.crn} </td>
                  <td> {section.getProfs().join(', ')} </td>

                  {tdElements}

                  <td>
                    <div data-tip='Open Seats/Total Seats' className={ css.inlineBlock }>
                      {section.seatsRemaining}/{section.seatsCapacity}
                    </div>
                  </td>

                  <td
                    className={ cx({
                      displayNone: !showWaitList,
                    }) }
                  >
                    <div data-tip='Open/Total Waitlist Seats' className={ css.inlineBlock }>
                      {section.waitRemaining}/{section.waitCapacity}
                    </div>
                  </td>

                  <td>
                    <a target='_blank' rel='noopener noreferrer' className={ `${css.inlineBlock} ${css.sectionGlobe}` } data-tip={ `View on ${section.host}` } href={ section.prettyUrl || section.url }>
                      <img src={ globe } alt='link' />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    // Render the Show More.. Button
    const showMoreSections = this.getShowMoreButton();

    // Figure out the credits string
    const creditsString = this.getCreditsString();

    return (
      <div>
        <div className={ `${css.container} ui segment` }>
          <div className={ css.header }>
            <span className={ css.classTitle }>
              {aClass.subject} {aClass.classId}: {aClass.name}
            </span>
            <span className={ css.classGlobeLinkContainer }>
              <a target='_blank' rel='noopener noreferrer' className={ css.classGlobeLink } data-tip={ `View on ${aClass.host}` } href={ aClass.prettyUrl || aClass.url }>
                <img src={ globe } alt='link' />
              </a>
            </span>
          </div>

          <div className={ css.body }>
            {aClass.desc}
            <br />
            <br />
            <div className={ css.leftPanel }>
              Prerequisites: {this.getReqsString('prereqs', aClass)}
              <br />
              Corequisites: {this.getReqsString('coreqs', aClass)}
              <br />
              Prerequisite for: {this.getReqsString('prereqsFor', aClass)}
              <br />
              Optional Prerequisite for: {this.optionalDisplay('optPrereqsFor')} {this.showMore('optPrereqsFor')}
            </div>
            <div className={ css.rightPanel }>
              <div data-tip='Check neu.edu for possible updates'> Updated {aClass.getLastUpdateString()}</div>
              {creditsString}
            </div>
          </div>
          {sectionTable}
          {showMoreSections}
        </div>
      </div>
    );
  }

  /**
   * Returns the 'Show More' button of the prereqType, if one is needed.
   * @param {String} prereqType type of prerequisite.
   */
  showMore(prereqType) {
    const data = this.getReqsString(prereqType, this.props.aClass);

    if (!Array.isArray(data) ||
      this.state.optPrereqsForPage >= 3 ||
      this.getShowAmount(prereqType) >= data.length) {
      return null;
    }

    return (
      <span
        className={ css.prereqShowMore }
        role='button'
        tabIndex={ 0 }
        onClick={ () => {
          if (prereqType === 'prereqsFor') {
            this.setState((prevState) => {
              return { prereqsForPage: prevState.prereqsForPage + 1 };
            });
          } else {
            this.setState((prevState) => {
              return { optPrereqsForPage: prevState.optPrereqsForPage + 1 };
            });
          }
        } }
      >Show More...
      </span>
    );
  }

  /**
   * Returns the array that we should be displaying
   *
   * @param {String} prereqType type of prerequisite.
   */
  optionalDisplay(prereqType) {
    const data = this.getReqsString(prereqType, this.props.aClass);

    if (Array.isArray(data)) {
      if (this.getStateValue(prereqType) >= 3) {
        return data;
      }

      const showAmt = this.getShowAmount(prereqType);

      if (showAmt < data.length) {
        data.length = showAmt;
      }

      if (typeof data[data.length - 1] === 'string') {
        data.length -= 1;
      }
    }

    return data;
  }

  /**
   * Returns the 'page' of the specified prerequisite.
   *
   * @param {String} prereqType type of prerequisite.
   */
  getStateValue(prereqType) {
    switch (prereqType) {
      case 'optPrereqsFor':
        return this.state.optPrereqsForPage;
      case 'prereqsFor':
        return this.state.prereqsForPage;
      default:
        return -1;
    }
  }

  /**
   * Returns how many elements we should return from our array of prerequisites.
   * Note that we mutliply our value by two because every other value is ', '
   *
   * @param {String} prereqType type of prerequisite.
   */
  getShowAmount(prereqType) {
    const stateValue = this.getStateValue(prereqType);
    return 2 * DesktopClassPanel.classesShownByDefault *
    (stateValue + 1);
  }
}

// Number of sections to show by default. This is different on mobile.
DesktopClassPanel.sectionsShownByDefault = 3;
DesktopClassPanel.classesShownByDefault = 5;

DesktopClassPanel.propTypes = {
  aClass: PropTypes.object.isRequired,
};


export default CSSModules(DesktopClassPanel, css);
